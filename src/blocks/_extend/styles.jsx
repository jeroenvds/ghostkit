// External Dependencies.
import shorthash from 'shorthash';
import classnames from 'classnames/dedupe';

// Internal Dependencies.
import { getCustomStylesAttr } from '../_utils.jsx';
const {
    applyFilters,
    addFilter,
} = wp.hooks;
const { createHigherOrderComponent } = wp.element;

/**
 * Extend block attributes with styles.
 *
 * @param {Object} settings Original block settings.
 * @param {String} name Original block name.
 *
 * @return {Object} Filtered block settings.
 */
function addAttribute( settings, name ) {
    const allowCustomStyles = applyFilters(
        'ghostkit.blocks.registerBlockType.allowCustomStyles',
        settings && settings.attributes && name && /^ghostkit/.test( name ),
        settings,
        name
    );
    if ( allowCustomStyles ) {
        if ( ! settings.attributes.ghostkitStyles ) {
            settings.attributes.ghostkitStyles = {
                type: 'object',
                default: '',
            };
        }
        if ( ! settings.attributes.ghostkitClassname ) {
            settings.attributes.ghostkitClassname = {
                type: 'string',
                default: '',
            };
        }
        if ( ! settings.attributes.ghostkitId ) {
            settings.attributes.ghostkitId = {
                type: 'string',
                default: false,
            };
        }
        settings = applyFilters( 'ghostkit.blocks.registerBlockType.withCustomStyles', settings, name );
    }

    return settings;
}

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning the custom styles if needed.
 *
 * @param {function|Component} BlockEdit Original component.
 *
 * @return {string} Wrapped component.
 */
const withNewAttrs = createHigherOrderComponent( ( BlockEdit ) => {
    return ( props ) => {
        // add new ghostkit props.
        if ( ! props.attributes.ghostkitClassname && typeof props.attributes.ghostkitClassname !== 'undefined' ) {
            props.attributes.ghostkitId = shorthash.unique( props.id );
            props.attributes.ghostkitClassname = props.name.replace( '/', '-' ) + '-' + props.attributes.ghostkitId;
        }

        return <BlockEdit { ...props } />;
    };
}, 'withNewAttrs' );

/**
 * Override props assigned to save component to inject custom styles.
 * This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
    const customStyles = applyFilters(
        'ghostkit.blocks.getSaveContent.customStyles',
        attributes.ghostkitStyles ? Object.assign( {}, attributes.ghostkitStyles ) : false,
        extraProps,
        blockType,
        attributes
    );

    if ( customStyles ) {
        extraProps = Object.assign( extraProps || {}, getCustomStylesAttr( customStyles ) );

        if ( attributes.ghostkitClassname ) {
            extraProps.className = classnames( extraProps.className ? extraProps.className.split( ' ' ) : '', attributes.ghostkitClassname );
        }
    }

    return extraProps;
}

/**
 * Override the default block element to add offset styles.
 *
 * @param  {Function} BlockListBlock Original component
 * @return {Function}                Wrapped component
 */
const withAttributes = createHigherOrderComponent( ( BlockListBlock ) => {
    return ( props ) => {
        let wrapperProps = props.wrapperProps;

        const customStyles = applyFilters(
            'ghostkit.editor.BlockListBlock.customStyles',
            props.block.attributes.ghostkitStyles ? Object.assign( {}, props.block.attributes.ghostkitStyles ) : false,
            props
        );

        if ( customStyles ) {
            wrapperProps = Object.assign( wrapperProps || {}, getCustomStylesAttr( customStyles ) );
        }

        return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
    };
}, 'withAttributes' );

export function styles() {
    addFilter( 'blocks.registerBlockType', 'ghostkit/styles/additional-attributes', addAttribute );
    addFilter( 'blocks.BlockEdit', 'ghostkit/styles/additional-attributes', withNewAttrs );
    addFilter( 'blocks.getSaveContent.extraProps', 'ghostkit/indents/save-props', addSaveProps );
    addFilter( 'editor.BlockListBlock', 'ghostkit/styles/additional-attributes', withAttributes );
}
