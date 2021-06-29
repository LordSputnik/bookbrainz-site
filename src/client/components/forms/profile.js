/*
 * Copyright (C) 2015       Ben Ockmore
 *               2015-2016  Sean Burke
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as bootstrap from 'react-bootstrap';
import * as utilsHelper from '../../helpers/utils';
import * as validators from '../../helpers/react-validators';
import CustomInput from '../../input';
import LoadingSpinner from '../loading-spinner';
import PropTypes from 'prop-types';
import React from 'react';
import ReactSelect from 'react-select';
import SearchSelect from '../input/entity-search';
import SelectWrapper from '../input/select-wrapper';


const {Alert, Button, Col, Panel, Row} = bootstrap;
const {injectDefaultAliasName} = utilsHelper;

class ProfileForm extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			area: props.editor.area ?
				props.editor.area : null,
			areaId: props.editor.area ?
				props.editor.area.id : null,
			bio: props.editor.bio,
			error: null,
			genderId: props.editor.gender ?
				props.editor.gender.id : null,
			genders: props.genders,
			name: props.editor.name,
			titleId: props.editor.titleUnlockId,
			titles: props.titles,
			waiting: false
		};
	}

	handleSubmit = async (evt) => {
		evt.preventDefault();
		if (!this.valid()) {
			return;
		}
		if (!this.hasChanged()) {
			return;
		}
		const {name, bio, areaId, titleId, genderId} = this.state;

		const data = {
			areaId,
			bio: bio.trim(),
			genderId,
			id: this.props.editor.id,
			name: name.trim(),
			title: titleId
		};
		this.setState({
			waiting: true
		});
		try {
			const response = await fetch('/editor/edit/handler', {
				body: JSON.stringify(data),
				headers: {
					'Content-Type': 'application/json; charset=utf-8'
				},
				method: 'POST'
			});
			if (!response.ok) {
				const {error} = await response.json();
				throw new Error(error ?? response.statusText);
			}

			window.location.href = `/editor/${this.props.editor.id}`;
		}
		catch (err) {
			this.setState({
				error: err,
				waiting: false
			});
		}
	};

	valid = () => {
		const {name} = this.state;
		return Boolean(name?.length);
	};

	hasChanged = () => {
		const {name, bio, areaId, titleId, genderId} = this.state;

		return this.props.editor?.area?.id !== areaId ||
			this.props.editor?.bio !== bio ||
			this.props.editor?.gender?.id !== genderId ||
			this.props.editor?.name !== name ||
			this.props.editor?.titleUnlockId !== titleId;
	};

	handleValueChange =(event) => {
		this.setState({[event.target.name]: event.target.value});
	};

	handleSelectChange = (value, idAttribute) => {
		this.setState({[idAttribute]: value});
	};

	render() {
		const loadingElement =
			this.state.waiting ? <LoadingSpinner/> : null;
		const genderOptions = this.state.genders.map((gender) => ({
			id: gender.id,
			name: gender.name
		}));
		const titleOptions = this.state.titles.map((unlock) => {
			const {title} = unlock;
			title.unlockId = unlock.id;
			return title;
		});
		const {area, genderId, titleId, name, bio} = this.state;

		const transformedArea = injectDefaultAliasName(area);

		let errorComponent = null;
		if (this.state.error) {
			errorComponent =
				<Alert variant="danger">{this.state.error.message}</Alert>;
		}

		const hasChanged = this.hasChanged();

		return (
			<div>
				<Row className="margin-top-2">
					{loadingElement}
					<Col md={8} mdOffset={2}>
						<form onSubmit={this.handleSubmit}>
							<Panel>
								<Panel.Heading>
									<Panel.Title>
										<span className="h3">Edit your public profile</span>
									</Panel.Title>
								</Panel.Heading>
								<Panel.Body>
									<CustomInput
										defaultValue={name}
										help="required"
										label="Display Name"
										name="name"
										type="text"
										validationState={this.valid() ? 'success' : 'error'}
										onChange={this.handleValueChange}
									/>
									<CustomInput
										defaultValue={bio}
										label="Bio"
										name="bio"
										type="textarea"
										onChange={this.handleValueChange}
									/>
									{titleOptions.length > 0 &&
										<SelectWrapper
											base={ReactSelect}
											defaultValue={titleId}
											idAttribute="unlockId"
											instanceId="title"
											label="Title"
											labelAttribute="title"
											name="titleId"
											options={titleOptions}
											placeholder="Select title"
											onChange={this.handleSelectChange}
										/>
									}
									<SearchSelect
										defaultValue={transformedArea}
										label="Area"
										name="areaId"
										placeholder="Select area..."
										type="area"
										onChange={this.handleSelectChange}
									/>
									<SelectWrapper
										base={ReactSelect}
										defaultValue={genderId}
										idAttribute="id"
										label="Gender"
										labelAttribute="name"
										name="genderId"
										options={genderOptions}
										placeholder="Select Gender"
										onChange={this.handleSelectChange}
									/>
									{errorComponent}
								</Panel.Body>
								<Panel.Footer>
									<Button
										disabled={!hasChanged}
										type="submit"
										variant="success"
									>
										Save changes
									</Button>
								</Panel.Footer>
							</Panel>
						</form>
					</Col>
				</Row>
			</div>
		);
	}
}

ProfileForm.displayName = 'ProfileForm';
ProfileForm.propTypes = {
	editor: PropTypes.shape({
		area: validators.labeledProperty,
		bio: PropTypes.string,
		gender: PropTypes.shape({
			id: PropTypes.number
		}),
		id: PropTypes.number,
		name: PropTypes.string,
		titleUnlockId: PropTypes.number
	}).isRequired,
	genders: PropTypes.array.isRequired,
	titles: PropTypes.array.isRequired
};

export default ProfileForm;
